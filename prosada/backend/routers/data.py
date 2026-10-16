from fastapi import APIRouter

from schemas.data import KgResponse, ProfilItem, RingkasanResponse, WilayahItem
from services import data_service

router = APIRouter(prefix="/data", tags=["Data"])


@router.get("/ringkasan", response_model=RingkasanResponse)
def ringkasan():
    return data_service.get_ringkasan()


@router.get("/wilayah", response_model=list[WilayahItem])
def wilayah():
    return data_service.get_wilayah()


@router.get("/profil", response_model=list[ProfilItem])
def profil():
    return data_service.get_profil()


@router.get("/kg", response_model=KgResponse)
def kg():
    return data_service.get_kg()
