import { NextResponse } from "next/server";
import { getDailyQuestions } from "@/lib/questions";

export async function GET() {
  try {
    const questions = await getDailyQuestions();
    return NextResponse.json(questions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
