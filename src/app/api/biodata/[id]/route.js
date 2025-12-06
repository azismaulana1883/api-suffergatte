import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sanitizeString, isValidId, isValidDate } from "@/lib/validate";

function parseId(params) {
  const id = Number(params.id);
  return isValidId(id) ? id : null;
}

export async function GET(req, { params }) {
  try {
    const id = parseId(params);
    if (!id) return NextResponse.json({ success: false, message: "ID tidak valid" }, { status: 400 });

    const data = await prisma.biodata.findUnique({ where: { id } });

    if (!data)
      return NextResponse.json({ success: false, message: "Data tidak ditemukan" }, { status: 404 });

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const id = parseId(params);
    if (!id) return NextResponse.json({ success: false, message: "ID tidak valid" }, { status: 400 });

    const body = await req.json();

    const allowedFields = [
      "nama",
      "nickname",
      "tanggal_lahir",
      "tempat_lahir",
      "jabatan",
      "jenis_kelamin",
      "prov",
      "kab",
      "kec",
      "kel",
      "nama_file",
    ];

    const dataToUpdate = {};

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        if (key === "tanggal_lahir") {
          if (!isValidDate(body[key])) {
            return NextResponse.json({ success: false, message: "tanggal_lahir tidak valid" }, { status: 400 });
          }
          dataToUpdate[key] = new Date(body[key]);
        } else {
          dataToUpdate[key] = sanitizeString(body[key]);
        }
      }
    }

    const updated = await prisma.biodata.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const id = parseId(params);
    if (!id) return NextResponse.json({ success: false, message: "ID tidak valid" }, { status: 400 });

    await prisma.biodata.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Data dihapus" });
  } catch {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
