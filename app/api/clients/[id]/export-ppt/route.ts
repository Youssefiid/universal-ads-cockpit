import { NextResponse } from "next/server";
import { getSession } from "@/lib/access";
import { prismaApp } from "@/lib/prisma";
import { getClientVisiblePourPortee } from "@/lib/queries";
import { genererRapportClientPptx } from "@/lib/pptx";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const client = await getClientVisiblePourPortee(prismaApp, id, session);
  if (!client) return NextResponse.json({ error: `Client '${id}' introuvable ou non assigné.` }, { status: 404 });

  const buffer = await genererRapportClientPptx(client);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="rapport-${client.id}.pptx"`,
      "Cache-Control": "no-store",
    },
  });
}
