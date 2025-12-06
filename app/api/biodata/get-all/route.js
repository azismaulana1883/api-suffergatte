import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sanitizeString, validateBiodata } from "@/lib/validate";

export const runtime = "nodejs";

// ===== CORS =====
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

// ===== Unique Key Generator =====
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

    const err = validateBiodata(body);
    if (err) {
      return NextResponse.json(
        { success: false, message: err },
        { status: 400, headers: corsHeaders }
      );
    }

    const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
    const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      return NextResponse.json(
        { success: false, message: "Cloudinary ENV tidak ditemukan." },
        { status: 500, headers: corsHeaders }
      );
    }

    // =============================
    // UPLOAD FILE UPLOAD (path)
    // =============================
    let uploadPathUrl = null;

    if (body.path) {
      const form1 = new FormData();
      form1.append("file", body.path);
      form1.append("upload_preset", UPLOAD_PRESET);

      const uploadRes1 = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: form1 }
      );
      const up1 = await uploadRes1.json();

      if (!up1.secure_url) {
        return NextResponse.json(
          { success: false, message: "Upload path gagal", debug: up1 },
          { status: 400, headers: corsHeaders }
        );
      }

      uploadPathUrl = up1.secure_url;
    }

    // =============================
    // UPLOAD FOTO KAMERA (path_verify)
    // =============================
    let uploadVerifyUrl = null;

    if (body.path_verify) {
      const form2 = new FormData();
      form2.append("file", body.path_verify);
      form2.append("upload_preset", UPLOAD_PRESET);

      const uploadRes2 = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: form2 }
      );
      const up2 = await uploadRes2.json();

      if (!up2.secure_url) {
        return NextResponse.json(
          { success: false, message: "Upload path_verify gagal", debug: up2 },
          { status: 400, headers: corsHeaders }
        );
      }

      uploadVerifyUrl = up2.secure_url;
    }

    // =============================
    // SAVE DB
    // =============================
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

        // === FIELD BARU ===
        path: uploadPathUrl,            // hasil upload file manual
        path_verify: uploadVerifyUrl,   // hasil upload foto kamera

        unique_key: uniqueKey,
      },
    });

    return NextResponse.json(
      { success: true, data: created, unique_key: uniqueKey },
      { status: 201, headers: corsHeaders }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Server error", error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}


// ======================================
// PATCH — UPDATE NICKNAME
// ======================================
export async function PATCH(req) {
  try {
    const { id, unique_key, new_nickname } = await req.json();

    if (!id || !unique_key || !new_nickname) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap" },
        { status: 400, headers: corsHeaders }
      );
    }

    const user = await prisma.biodata.findFirst({
      where: { id: Number(id), unique_key },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "ID atau Unique Key salah!" },
        { status: 404, headers: corsHeaders }
      );
    }

    await prisma.biodata.update({
      where: { id: Number(id) },
      data: { nickname: new_nickname },
    });

    return NextResponse.json(
      { success: true, message: "Nickname updated" },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Server error", error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
