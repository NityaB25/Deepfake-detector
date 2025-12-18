FROM python:3.13-slim

# System deps (opencv, video, PIL)
RUN apt-get update && apt-get install -y \
    libgl1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Upgrade pip (important for wheels)
RUN pip install --upgrade pip

# Copy only ML requirements
COPY apps/ml/requirements.txt .

# Install Python deps
RUN pip install --no-cache-dir \
    torch torchvision --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Copy ML code
COPY apps/ml .

# Expose Fly default port
EXPOSE 8080

# Start FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
