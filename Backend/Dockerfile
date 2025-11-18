# syntax=docker/dockerfile:1
FROM python:3.11-slim as builder

# Install build dependencies INCLUDING PostgreSQL dev libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ pkg-config git build-essential \
    libffi-dev libssl-dev \
    libpq-dev postgresql-client \
    && rm -rf /var/lib/apt/lists/*

ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /wheels

COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip wheel setuptools && \
    pip wheel --no-deps --wheel-dir /wheels \
    --extra-index-url https://download.pytorch.org/whl/cu121 \
    -r requirements.txt

# Runtime stage
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 libglib2.0-0 libgl1 libglx-mesa0 libgthread-2.0-0 \
    libsm6 libxext6 libxrender1 libfontconfig1 \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy wheels but exclude requirements.txt
COPY --from=builder /wheels/*.whl /tmp/wheels/
RUN pip install --no-cache-dir /tmp/wheels/*.whl \
    && rm -rf /tmp/wheels

COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

