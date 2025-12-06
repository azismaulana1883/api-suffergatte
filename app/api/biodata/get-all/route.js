import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sanitizeString, validateBiodata } from "@/lib/validate";

export const runtime = "nodejs"; // WAJIB untuk Cloudinary + env

// CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

// Unique Key Generator
function generateUniqueKey() {
  const rand = Math.random().toString(36).substring(2, 10);
  const time = Date.now().toString(36);
  return `UNQ-${rand}${time}`;
}

// ======================================
// GET ALL BIODATA
// ======================================
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

// ======================================
// POST — CREATE BIODATA
// ======================================
export async function POST(req) {
  try {
    const body = await req.json();

    // Validasi input
    const err = validateBiodata(body);
    if (err) {
      return NextResponse.json(
        { success: false, message: err },
        { status: 400, headers: corsHeaders }
      );
    }

    // ======================================
    // UPLOAD FOTO KE CLOUDINARY (FIX VERSION)
    // ======================================
    let fileUrl = null;

    if (body.foto_base64) {
      const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
      const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;

      console.log("ENV:", CLOUD_NAME, UPLOAD_PRESET);

      if (!CLOUD_NAME || !UPLOAD_PRESET) {
        return NextResponse.json(
          { success: false, message: "Cloudinary ENV tidak ditemukan." },
          { status: 500, headers: corsHeaders }
        );
      }

      const uploadURL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

      // ❗ Gunakan FormData bawaan runtime, bukan dari 'form-data'
      const form = new FormData();
      form.append("file", body.foto_base64);
      form.append("upload_preset", UPLOAD_PRESET);

      const uploadRes = await fetch(uploadURL, {
        method: "POST",
        body: form, // ❗ Jangan tambahkan getHeaders()
      });

      const uploadJson = await uploadRes.json();
      console.log("UPLOAD RESPONSE:", uploadJson);

      if (!uploadJson.secure_url) {
        return NextResponse.json(
          { success: false, message: "Upload foto gagal.", debug: uploadJson },
          { status: 400, headers: corsHeaders }
        );
      }

      fileUrl = uploadJson.secure_url;
    }

    // ======================================
    // SIMPAN DATA KE DATABASE
    // ======================================
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

        nama_file: null,
        path: fileUrl,
        unique_key: uniqueKey,
      },
    });

    return NextResponse.json(
      { success: true, unique_key: uniqueKey, data: created },
      { status: 201, headers: corsHeaders }
    );
  } catch (err) {
    console.log("SERVER ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error", error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
