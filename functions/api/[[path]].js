const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function getRow(db, table, id) {
  return db.prepare(`SELECT data FROM ${table} WHERE id = ?`).bind(id).first();
}

async function listAll(db, table) {
  const { results } = await db.prepare(`SELECT data FROM ${table}`).all();
  return results.map((r) => JSON.parse(r.data));
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const db = env.DB;
  const path = params.path || [];
  const [resource, idOrA, idOrB] = path;

  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    if (request.method === "GET" && resource === "state") {
      const [students, programs, adventures, suggestions] = await Promise.all([
        listAll(db, "students"),
        listAll(db, "programs"),
        listAll(db, "adventures"),
        listAll(db, "suggestions"),
      ]);
      return json({ students, programs, adventures, suggestions });
    }

    if (resource === "students") {
      if (request.method === "POST") {
        const body = await request.json();
        await db.prepare("INSERT INTO students (id, data) VALUES (?, ?)").bind(body.id, JSON.stringify(body)).run();
        return json(body, 201);
      }
      if (request.method === "PATCH" && idOrA) {
        const patch = await request.json();
        const row = await getRow(db, "students", idOrA);
        if (!row) return json({ error: "not found" }, 404);
        const merged = { ...JSON.parse(row.data), ...patch };
        await db.prepare("UPDATE students SET data = ? WHERE id = ?").bind(JSON.stringify(merged), idOrA).run();
        return json(merged);
      }
      if (request.method === "DELETE" && idOrA) {
        await db.prepare("DELETE FROM students WHERE id = ?").bind(idOrA).run();
        await db.prepare("DELETE FROM adventures WHERE student_id = ?").bind(idOrA).run();
        return json({ ok: true });
      }
    }

    if (resource === "programs") {
      if (request.method === "POST") {
        const body = await request.json();
        await db.prepare("INSERT INTO programs (id, data) VALUES (?, ?)").bind(body.id, JSON.stringify(body)).run();
        return json(body, 201);
      }
      if (request.method === "PATCH" && idOrA) {
        const patch = await request.json();
        const row = await getRow(db, "programs", idOrA);
        if (!row) return json({ error: "not found" }, 404);
        const merged = { ...JSON.parse(row.data), ...patch };
        await db.prepare("UPDATE programs SET data = ? WHERE id = ?").bind(JSON.stringify(merged), idOrA).run();
        return json(merged);
      }
      if (request.method === "DELETE" && idOrA) {
        await db.prepare("DELETE FROM programs WHERE id = ?").bind(idOrA).run();
        await db.prepare("DELETE FROM adventures WHERE program_id = ?").bind(idOrA).run();
        return json({ ok: true });
      }
    }

    if (resource === "adventures") {
      if (request.method === "POST") {
        const body = await request.json();
        const id = `${body.studentId}::${body.programId}`;
        await db
          .prepare("INSERT OR IGNORE INTO adventures (id, student_id, program_id, data) VALUES (?, ?, ?, ?)")
          .bind(id, body.studentId, body.programId, JSON.stringify(body))
          .run();
        return json(body, 201);
      }
      if (request.method === "PATCH" && idOrA && idOrB) {
        const id = `${idOrA}::${idOrB}`;
        const patch = await request.json();
        const row = await getRow(db, "adventures", id);
        if (!row) return json({ error: "not found" }, 404);
        const merged = { ...JSON.parse(row.data), ...patch };
        await db.prepare("UPDATE adventures SET data = ? WHERE id = ?").bind(JSON.stringify(merged), id).run();
        return json(merged);
      }
    }

    if (resource === "suggestions") {
      if (request.method === "POST") {
        const body = await request.json();
        await db.prepare("INSERT INTO suggestions (id, data) VALUES (?, ?)").bind(body.id, JSON.stringify(body)).run();
        return json(body, 201);
      }
      if (request.method === "PATCH" && idOrA) {
        const patch = await request.json();
        const row = await getRow(db, "suggestions", idOrA);
        if (!row) return json({ error: "not found" }, 404);
        const merged = { ...JSON.parse(row.data), ...patch };
        await db.prepare("UPDATE suggestions SET data = ? WHERE id = ?").bind(JSON.stringify(merged), idOrA).run();
        return json(merged);
      }
    }

    return json({ error: "not found", path }, 404);
  } catch (err) {
    return json({ error: String(err && err.message ? err.message : err) }, 500);
  }
}
