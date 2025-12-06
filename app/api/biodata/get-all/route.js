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

    let fileName = null;
    let fileUrl = null;

    // ===============================
    // 📸 Simpan Foto Base64
    // ===============================
    if (body.foto_base64) {
      const base64Data = body.foto_base64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      fileName = `foto_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 10)}.png`;

      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, fileName);
      await fs.writeFile(filePath, buffer);

      fileUrl = `/uploads/${fileName}`;
    }

    // ===============================
    // 🧹 Data Bersih + Generate unique_key
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

        nama_file: fileName,
        path: fileUrl,

        unique_key: uniqueKey, // ⬅ SIMPAN ke database
      },
    });

    // ===============================
    // 🔥 RETURN unique_key KE FRONTEND
    // ===============================
    return NextResponse.json(
      {
        success: true,
        unique_key: uniqueKey, // ⬅ WAJIB ADA!
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
