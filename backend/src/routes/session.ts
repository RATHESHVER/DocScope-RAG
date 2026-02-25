import express from "express";
import { createSessionId } from "../session/sessionManager";

const router = express.Router();

router.get("/", (req, res) => {
  const sessionId = createSessionId();

  res.json({
    sessionId
  });
});

export default router;