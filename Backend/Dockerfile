FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required by some Python packages (e.g., python-magic).
# This prevents errors during 'pip install'.
RUN apt-get update && apt-get install -y libmagic1 && rm -rf /var/lib/apt/lists/*

# Copy and install Python requirements first to leverage Docker layer caching.
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code.
COPY app /app/app
COPY alembic /app/alembic
COPY alembic.ini /app/alembic.ini

# Ensures that Python output is sent straight to the terminal without being buffered first.
ENV PYTHONUNBUFFERED=1

# The command to run your application.
# The --reload flag is great for development as it automatically restarts the server on code changes.
# For a pure production deployment, you might remove the --reload flag for a performance boost.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
