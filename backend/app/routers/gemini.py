from typing import Optional, Any
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.gemini_service import (
    generate_announcement_draft,
    analyze_reports,
    generate_dashboard_summary,
    ask_rit,
    generate_broadcast,
    generate_fleet_summary
)


router = APIRouter(prefix="/api/gemini", tags=["gemini"])

class AnnouncementDraftRequest(BaseModel):
    topic: str
    tone: Optional[str] = "Formal"

class AnalyzeReportsRequest(BaseModel):
    reports: list[str]

class DashboardSummaryRequest(BaseModel):
    data: dict[str, Any]

class AskRitRequest(BaseModel):
    question: str
    systemInstruction: Optional[str] = ""

class GenerateBroadcastRequest(BaseModel):
    topic: Optional[str] = ""
    type: Optional[str] = "general"
    tone: Optional[str] = "Formal"
    dataContext: Optional[dict[str, Any]] = None

@router.post("/announcement-draft")
async def handle_announcement_draft(payload: AnnouncementDraftRequest):
    text = await generate_announcement_draft(payload.topic, payload.tone or "Formal")
    return {"success": True, "text": text}

@router.post("/analyze-reports")
async def handle_analyze_reports(payload: AnalyzeReportsRequest):
    text = await analyze_reports(payload.reports)
    return {"success": True, "text": text}

@router.post("/dashboard-summary")
async def handle_dashboard_summary(payload: DashboardSummaryRequest):
    text = await generate_dashboard_summary(payload.data)
    return {"success": True, "text": text}

@router.post("/ask-rit")
async def handle_ask_rit(payload: AskRitRequest):
    text = await ask_rit(payload.question, payload.systemInstruction or "")
    return {"success": True, "text": text}

@router.post("/generate-broadcast")
async def handle_generate_broadcast(payload: GenerateBroadcastRequest):
    text = await generate_broadcast(
        topic=payload.topic or "",
        broadcast_type=payload.type or "general",
        tone=payload.tone or "Formal",
        data_context=payload.dataContext
    )
    return {"success": True, "text": text}

class FleetSummaryRequest(BaseModel):
    data: dict[str, Any]

@router.post("/fleet-summary")
async def handle_fleet_summary(payload: FleetSummaryRequest):
    text = await generate_fleet_summary(payload.data)
    return {"success": True, "text": text}

