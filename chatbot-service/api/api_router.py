from fastapi import APIRouter, HTTPException
import api

router = APIRouter()

router.include_router(api.router, prefix="/api", tags=["api"])