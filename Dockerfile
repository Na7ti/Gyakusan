FROM denoland/deno:2.1.4

WORKDIR /app

# Cache the dependencies as a layer
COPY deno.json .
RUN deno cache deno.json || true

COPY . .
RUN deno cache main.ts

EXPOSE 8000

CMD ["run", "-A", "main.ts"]
