FROM eclipse-temurin:21-jre
WORKDIR /app
COPY .build/payment-service/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=docker"]
