FROM eclipse-temurin:21-jre-jammy AS java
FROM node:22-bookworm-slim
COPY --from=java /opt/java/openjdk /opt/java/openjdk
ENV JAVA_HOME=/opt/java/openjdk
ENV PATH="${JAVA_HOME}/bin:${PATH}"
ENV CI=true FIREBASE_CLI_DISABLE_UPDATE_CHECK=true
RUN npm install --global firebase-tools@15.34.0 \
    && firebase setup:emulators:firestore \
    && firebase setup:emulators:ui \
    && npm cache clean --force
WORKDIR /app
COPY docker/firebase/firebase.json ./firebase.json
COPY firestore.rules ./firestore.rules
COPY docker/firebase/start.sh /usr/local/bin/start-emulators
RUN chmod +x /usr/local/bin/start-emulators
EXPOSE 4100 8180 9199 9250
ENTRYPOINT ["/usr/local/bin/start-emulators"]
