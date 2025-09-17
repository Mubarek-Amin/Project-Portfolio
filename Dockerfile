FROM nginxinc/nginx-unprivileged:alpine


# Copy site
COPY index.html /usr/share/nginx/html/index.html
COPY styles.css /usr/share/nginx/html/styles.css
COPY script.js /usr/share/nginx/html/script.js
COPY assets/ /usr/share/nginx/html/assets/
COPY data/ /usr/share/nginx/html/data/


# Use our server config
COPY nginx.conf /etc/nginx/conf.d/default.conf


# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:8080/ || exit 1