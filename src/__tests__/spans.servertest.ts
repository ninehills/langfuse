/** @jest-environment node */

import { prisma } from "@/src/server/db";
import { makeAPICall } from "@/src/__tests__/test-utils";
import { v4 as uuidv4 } from "uuid";

describe("/api/public/spans API Endpoint", () => {
  const pruneDatabase = async () => {
    await prisma.observation.deleteMany();
    await prisma.score.deleteMany();
    await prisma.trace.deleteMany();
  };

  beforeEach(async () => await pruneDatabase());
  afterEach(async () => await pruneDatabase());

  it("should create span after trace", async () => {
    await pruneDatabase();

    const traceId = uuidv4();

    await makeAPICall("POST", "/api/public/traces", {
      id: traceId,
      name: "trace-name",
      userId: "user-1",
      projectId: "7a88fb47-b4e2-43b8-a06c-a5ce950dc53a",
      metadata: { key: "value" },
      release: "1.0.0",
      version: "2.0.0",
    });

    const dbTrace = await prisma.trace.findMany({
      where: {
        id: traceId,
      },
    });

    expect(dbTrace.length).toBeGreaterThan(0);
    expect(dbTrace[0]?.id).toBe(traceId);

    const spanId = uuidv4();
    const createSpan = await makeAPICall("POST", "/api/public/spans", {
      id: spanId,
      traceId: traceId,
      name: "span-name",
      startTime: "2021-01-01T00:00:00.000Z",
      endTime: "2021-01-01T00:00:00.000Z",
      input: { input: "value" },
      metadata: { meta: "value" },
      version: "2.0.0",
    });

    expect(createSpan.status).toBe(200);
    const dbSpan = await prisma.observation.findUnique({
      where: {
        id: spanId,
      },
    });

    expect(dbSpan?.id).toBe(spanId);
    expect(dbSpan?.traceId).toBe(traceId);
    expect(dbSpan?.name).toBe("span-name");
    expect(dbSpan?.startTime).toEqual(new Date("2021-01-01T00:00:00.000Z"));
    expect(dbSpan?.endTime).toEqual(new Date("2021-01-01T00:00:00.000Z"));
    expect(dbSpan?.input).toEqual({ input: "value" });
    expect(dbSpan?.metadata).toEqual({ meta: "value" });
    expect(dbSpan?.version).toBe("2.0.0");
  });

  it("should create span before trace", async () => {
    await pruneDatabase();

    const traceId = uuidv4();
    const spanId = uuidv4();

    const createSpan = await makeAPICall("POST", "/api/public/spans", {
      id: spanId,
      traceId: traceId,
      name: "span-name",
      startTime: "2021-01-01T00:00:00.000Z",
      endTime: "2021-01-01T00:00:00.000Z",
      input: { input: "value" },
      metadata: { meta: "value" },
      version: "2.0.0",
    });

    expect(createSpan.status).toBe(200);
    const dbSpan = await prisma.observation.findUnique({
      where: {
        id: spanId,
      },
    });

    expect(dbSpan?.id).toBe(spanId);
    expect(dbSpan?.traceId).toBe(traceId);
    expect(dbSpan?.name).toBe("span-name");
    expect(dbSpan?.startTime).toEqual(new Date("2021-01-01T00:00:00.000Z"));
    expect(dbSpan?.endTime).toEqual(new Date("2021-01-01T00:00:00.000Z"));
    expect(dbSpan?.input).toEqual({ input: "value" });
    expect(dbSpan?.metadata).toEqual({ meta: "value" });
    expect(dbSpan?.version).toBe("2.0.0");

    await makeAPICall("POST", "/api/public/traces", {
      id: traceId,
      name: "trace-name",
      userId: "user-1",
      projectId: "7a88fb47-b4e2-43b8-a06c-a5ce950dc53a",
      metadata: { key: "value" },
      release: "1.0.0",
      version: "2.0.0",
    });

    const dbTrace = await prisma.trace.findMany({
      where: {
        id: traceId,
      },
    });

    expect(dbTrace.length).toBeGreaterThan(0);
    expect(dbTrace[0]?.id).toBe(traceId);
  });

  it("should create span after trace based on externalId", async () => {
    await pruneDatabase();

    const traceId = uuidv4();

    await makeAPICall("POST", "/api/public/traces", {
      externalId: traceId,
      name: "trace-name",
      userId: "user-1",
      projectId: "7a88fb47-b4e2-43b8-a06c-a5ce950dc53a",
      metadata: { key: "value" },
      release: "1.0.0",
      version: "2.0.0",
    });

    const dbTrace = await prisma.trace.findMany({
      where: {
        externalId: traceId,
      },
    });

    expect(dbTrace.length).toBeGreaterThan(0);
    expect(dbTrace[0]?.externalId).toBe(traceId);
    expect(dbTrace[0]?.id).not.toBe(traceId);

    const spanId = uuidv4();
    const createSpan = await makeAPICall("POST", "/api/public/spans", {
      id: spanId,
      traceIdType: "EXTERNAL",
      traceId: traceId,
      name: "span-name",
      startTime: "2021-01-01T00:00:00.000Z",
      endTime: "2021-01-01T00:00:00.000Z",
      input: { input: "value" },
      metadata: { meta: "value" },
      version: "2.0.0",
    });

    expect(createSpan.status).toBe(200);
    const dbSpan = await prisma.observation.findUnique({
      where: {
        id: spanId,
      },
    });

    expect(dbSpan?.id).toBe(spanId);
    expect(dbSpan?.traceId).toBe(dbTrace[0]?.id);
    expect(dbSpan?.name).toBe("span-name");
    expect(dbSpan?.startTime).toEqual(new Date("2021-01-01T00:00:00.000Z"));
    expect(dbSpan?.endTime).toEqual(new Date("2021-01-01T00:00:00.000Z"));
    expect(dbSpan?.input).toEqual({ input: "value" });
    expect(dbSpan?.metadata).toEqual({ meta: "value" });
    expect(dbSpan?.version).toBe("2.0.0");
  });

  it("should create trace when creating span without existing trace", async () => {
    const spanName = uuidv4();

    const spanId = uuidv4();
    const createSpan = await makeAPICall("POST", "/api/public/spans", {
      id: spanId,
      name: spanName,
      startTime: "2021-01-01T00:00:00.000Z",
      endTime: "2021-01-01T00:00:00.000Z",
      input: { input: "value" },
      metadata: { meta: "value" },
      version: "2.0.0",
    });

    const dbTrace = await prisma.trace.findMany({
      where: {
        name: spanName,
      },
    });

    expect(dbTrace.length).toBe(1);
    expect(dbTrace[0]?.name).toBe(spanName);

    expect(createSpan.status).toBe(200);
    const dbSpan = await prisma.observation.findUnique({
      where: {
        id: spanId,
      },
    });

    expect(dbSpan?.id).toBe(spanId);
    expect(dbSpan?.traceId).toBe(dbTrace[0]?.id);
    expect(dbSpan?.name).toBe(spanName);
    expect(dbSpan?.startTime).toEqual(new Date("2021-01-01T00:00:00.000Z"));
    expect(dbSpan?.endTime).toEqual(new Date("2021-01-01T00:00:00.000Z"));
    expect(dbSpan?.input).toEqual({ input: "value" });
    expect(dbSpan?.metadata).toEqual({ meta: "value" });
    expect(dbSpan?.version).toBe("2.0.0");
  });

  it("should create trace when creating span without existing trace with externalId", async () => {
    const spanName = uuidv4();

    const spanId = uuidv4();
    const externalTraceId = uuidv4();
    const createSpan = await makeAPICall("POST", "/api/public/spans", {
      id: spanId,
      traceIdType: "EXTERNAL",
      traceId: externalTraceId,
      name: spanName,
      startTime: "2021-01-01T00:00:00.000Z",
      endTime: "2021-01-01T00:00:00.000Z",
      input: { input: "value" },
      metadata: { meta: "value" },
      version: "2.0.0",
    });

    const dbTrace = await prisma.trace.findMany({
      where: {
        externalId: externalTraceId,
      },
    });

    expect(dbTrace.length).toBe(1);
    expect(dbTrace[0]?.name).toBeNull();

    expect(createSpan.status).toBe(200);
    const dbSpan = await prisma.observation.findUnique({
      where: {
        id: spanId,
      },
    });

    expect(dbSpan?.id).toBe(spanId);
    expect(dbSpan?.traceId).toBe(dbTrace[0]?.id);
    expect(dbSpan?.name).toBe(spanName);
    expect(dbSpan?.startTime).toEqual(new Date("2021-01-01T00:00:00.000Z"));
    expect(dbSpan?.endTime).toEqual(new Date("2021-01-01T00:00:00.000Z"));
    expect(dbSpan?.input).toEqual({ input: "value" });
    expect(dbSpan?.metadata).toEqual({ meta: "value" });
    expect(dbSpan?.version).toBe("2.0.0");
  });

  it("should create trace when creating span without existing trace without traceId", async () => {
    const generationName = uuidv4();

    const spanId = uuidv4();
    const createSpan = await makeAPICall("POST", "/api/public/spans", {
      id: spanId,
      name: generationName,
      startTime: "2021-01-01T00:00:00.000Z",
      endTime: "2021-01-01T00:00:00.000Z",
      input: { key: "value" },
      metadata: { key: "value" },
      version: "2.0.0",
    });

    const dbSpan = await prisma.observation.findFirstOrThrow({
      where: {
        name: generationName,
      },
    });

    const dbTrace = await prisma.trace.findMany({
      where: {
        id: dbSpan.traceId,
      },
    });

    expect(dbTrace.length).toBe(1);
    expect(dbTrace[0]?.name).toBe(generationName);

    expect(createSpan.status).toBe(200);

    expect(dbSpan?.id).toBe(spanId);
    expect(dbSpan?.traceId).toBe(dbTrace[0]?.id);
    expect(dbSpan?.name).toBe(generationName);
    expect(dbSpan?.startTime).toEqual(new Date("2021-01-01T00:00:00.000Z"));
    expect(dbSpan?.endTime).toEqual(new Date("2021-01-01T00:00:00.000Z"));
    expect(dbSpan?.input).toEqual({ key: "value" });
    expect(dbSpan?.metadata).toEqual({ key: "value" });
    expect(dbSpan?.version).toBe("2.0.0");
  });

  it("should update span", async () => {
    const spanName = uuidv4();

    const spanId = uuidv4();
    const createSpan = await makeAPICall("POST", "/api/public/spans", {
      id: spanId,
      name: spanName,
      startTime: "2021-01-01T00:00:00.000Z",
      endTime: "2021-01-01T00:00:00.000Z",
      input: { input: "value" },
      metadata: { meta: "value" },
      version: "2.0.0",
    });

    expect(createSpan.status).toBe(200);

    const updatedSpan = await makeAPICall("PATCH", "/api/public/spans", {
      spanId: spanId,
      output: { key: "this is a great gpt output" },
    });
    expect(updatedSpan.status).toBe(200);

    const dbSpan = await prisma.observation.findUnique({
      where: {
        id: spanId,
      },
    });

    expect(dbSpan?.id).toBe(spanId);
    expect(dbSpan?.name).toBe(spanName);
    expect(dbSpan?.startTime).toEqual(new Date("2021-01-01T00:00:00.000Z"));
    expect(dbSpan?.endTime).toEqual(new Date("2021-01-:00:00.000Z"));
    expect(dbSpan?.input).toEqual({ input: "value" });
    expect(dbSpan?.output).toEqual({ key: "this is a great gpt output" });
    expect(dbSpan?.metadata).toEqual({ meta: "value" });
    expect(dbSpan?.version).toBe("2.0.0");
  });

  it("should fail update span if span does not exist", async () => {
    const spanId = uuidv4();

    const updatedSpan = await makeAPICall("PATCH", "/api/public/spans", {
      spanId: spanId,
      output: { key: "this is a great gpt output" },
    });
    expect(updatedSpan.status).toBe(404);
  });
});
