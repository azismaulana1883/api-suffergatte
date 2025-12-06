import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sanitizeString, validateBiodata } from "@/lib/validate";
import fs from "fs/promises";
import path from "path";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

// ===============================
// 🔑 Unique Key Generator
// ===============================
function generateUniqueKey() {
  const rand = Math.random().toString(36).substring(2, 10);
  const time = Date.now().toString(36);
  return `UNQ-${rand}${time}`;
}

export async function GET() {
  try {
    const data = await prisma.biodata.findMany({
      orderBy: { id: "desc" },
    });

    return NextResponse.json(
      { success: true, data },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    // Validasi form
    const err = validateBiodata(body);
    if (err) {
      return NextResponse.json(
        { success: false, message: err },
        { status: 400, headers: corsHeaders }
      );
    }

    // ===============================
    // 📸 Simpan Foto Base64 LANGSUNG (tanpa write file)
    // ===============================
    let fileUrl = null;

    if (body.foto_base64) {
      // Pastikan string base64 valid
      if (!body.foto_base64.startsWith("data:image/")) {
        return NextResponse.json(
          { success: false, message: "Format foto tidak valid." },
          { status: 400, headers: corsHeaders }
        );
      }

      fileUrl = body.foto_base64; // langsung simpan base64
    }

    // ===============================
    // 🧹 Data Bersih + unique_key
    // ===============================
    const uniqueKey = generateUniqueKey();

    const created = await prisma.biodata.create({
      data: {
        nama: sanitizeString(body.nama),
        nickname: sanitizeString(body.nickname),
        tanggal_lahir: new Date(body.tanggal_lahir),
        tempat_lahir: sanitizeString(body.tempat_lahir),
        jabatan: sanitizeString(body.jabatan),
        jenis_kelamin: sanitizeString(body.jenis_kelamin),
        prov: sanitizeString(body.prov),
        kab: sanitizeString(body.kab),
        kec: sanitizeString(body.kec),
        kel: sanitizeString(body.kel),

        // Tidak perlu nama_file lagi
        nama_file: null,

        // Simpan base64
        path: fileUrl,

        unique_key: uniqueKey,
      },
    });

    // ===============================
    // 🔥 RETURN unique_key KE FRONTEND
    // ===============================
    return NextResponse.json(
      {
        success: true,
        unique_key: uniqueKey,
        data: created,
      },
      { status: 201, headers: corsHeaders }
    );

  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Server error", error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

