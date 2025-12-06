import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    console.log("PATCH BODY:", body);

    const { id, unique_key, new_nickname } = body;

    if (!id || !unique_key || !new_nickname) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap." },
        { status: 400, headers: corsHeaders }
      );
    }

    // 1️⃣ Cek apakah user dengan id + unique_key valid
    const user = await prisma.biodata.findFirst({
      where: {
        id: Number(id),
        unique_key: unique_key,
      },
    });

    console.log("FOUND USER:", user);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "ID atau Unique Key salah!" },
        { status: 404, headers: corsHeaders }
      );
    }

    // 2️⃣ Update nickname
    const updated = await prisma.biodata.update({
      where: { id: Number(id) }, // id sudah pasti aman karena unique_key dicek
      data: { nickname: new_nickname },
    });

    console.log("UPDATED:", updated);

    return NextResponse.json(
      { success: true },
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    console.error("UPDATE ERROR:", err);

    return NextResponse.json(
      { success: false, message: "Server error", error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
