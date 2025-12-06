import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sanitizeString, validateBiodata } from "@/lib/validate";

// CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

// 🔑 Unique Key Generator
function generateUniqueKey() {
  const rand = Math.random().toString(36).substring(2, 10);
  const time = Date.now().toString(36);
  return `UNQ-${rand}${time}`;
}

// ===============================
// GET ALL BIODATA
// ===============================
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

// ===============================
// POST — CREATE BIODATA
// ===============================
export async function POST(req) {
  try {
    const body = await req.json();

    // Validasi
    const err = validateBiodata(body);
    if (err) {
      return NextResponse.json(
        { success: false, message: err },
        { status: 400, headers: corsHeaders }
      );
    }

    // ===============================
    // 📸 Upload Foto Base64 → Cloudinary
    // ===============================
    let fileUrl = null;
    let publicId = null;

    if (body.foto_base64) {
      if (!body.foto_base64.startsWith("data:image/")) {
        return NextResponse.json(
          { success: false, message: "Format foto tidak valid." },
          { status: 400, headers: corsHeaders }
        );
      }

      try {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const preset = process.env.CLOUDINARY_UPLOAD_PRESET;

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file: body.foto_base64,
              upload_preset: preset,
              folder: "registrasi",
            }),
          }
        ).then((r) => r.json());

        if (!uploadRes.secure_url) {
          throw new Error("Upload gagal");
        }

        fileUrl = uploadRes.secure_url;
        publicId = uploadRes.public_id;
      } catch (e) {
        console.error("Cloudinary error:", e);
        return NextResponse.json(
          { success: false, message: "Upload foto gagal." },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // Unique Key
    const uniqueKey = generateUniqueKey();

    // Simpan ke database
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

        // Simpan public_id (optional)
        nama_file: publicId,

        // Simpan URL Cloudinary
        path: fileUrl,

        unique_key: uniqueKey,
      },
    });

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
