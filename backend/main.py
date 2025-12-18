from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from api.auth import router as auth_router
from api.questions import router as questions_router
from api.rounds import router as rounds_router
from api.users import router as users_router
from api.assignments import router as assignments_router
from api.evaluations import router as evaluations_router
from api.results import router as results_router

app = FastAPI(title="Employee Evaluation System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="../frontend"), name="static")

# Serve HTML templates
@app.get("/")
async def read_index():
    return FileResponse("../templates/index.html")

@app.get("/admin.html")
async def read_admin():
    return FileResponse("../templates/admin.html")

@app.get("/user.html")
async def read_user():
    return FileResponse("../templates/user.html")

# Include routers
app.include_router(auth_router, prefix="/api", tags=["auth"])
app.include_router(questions_router, prefix="/api", tags=["questions"])
app.include_router(rounds_router, prefix="/api", tags=["rounds"])
app.include_router(users_router, prefix="/api", tags=["users"])
app.include_router(assignments_router, prefix="/api", tags=["assignments"])
app.include_router(evaluations_router, prefix="/api", tags=["evaluations"])
app.include_router(results_router, prefix="/api", tags=["results"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)