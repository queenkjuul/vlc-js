FROM registry.videolan.org/vlc-debian-wasm-emscripten:20220505193036

USER root
# 1. Point deb.debian.org and security.debian.org to archive.debian.org
# 2. Remove the bullseye-updates line (no longer valid after EOL)
RUN sed -i 's|deb.debian.org|archive.debian.org|g' /etc/apt/sources.list \
    && sed -i 's|security.debian.org|archive.debian.org|g' /etc/apt/sources.list \
    && sed -i '/bullseye-updates/d' /etc/apt/sources.list

# 3. Tell APT not to reject the archive's expired Release files
RUN echo 'Acquire::Check-Valid-Until "false";' > /etc/apt/apt.conf.d/99no-check-valid-until
RUN apt-get update && apt-get upgrade -y && apt-get install -y python3-venv clang

RUN git config --global --add safe.directory "*"