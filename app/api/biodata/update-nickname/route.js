import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // WAJIB untuk membuat CORS OPTIONS bekerja

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
    const { id, unique_key, new_nickname } = body;

    if (!id || !unique_key || !new_nickname) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Cek user
    const user = await prisma.biodata.findFirst({
      where: {
        id: Number(id),
        unique_key: unique_key,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "ID atau Unique Key salah!" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Update
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
