"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sync_controller_1 = require("../controllers/sync.controller");
const router = (0, express_1.Router)();
router.post('/garmin', sync_controller_1.handleGarminWebhook);
router.all('/strava', sync_controller_1.handleStravaWebhook); // GET for challenge, POST for events
exports.default = router;
