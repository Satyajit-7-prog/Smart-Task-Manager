import uvicorn

if __name__ == "__main__":
    print("Starting Smart Task Manager Backend Dev Server...")
    print("Swagger UI Docs will be available at: http://127.0.0.1:8000/docs")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
