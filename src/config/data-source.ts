import { DataSource } from "typeorm";
import dotenv from "dotenv";

import { User } from "../entities/User";
import { Notification } from "../entities/Notification";
import { AppSession } from "../entities/AppSession";
import { ClassRoom } from "../entities/ClassRoom";
import { Event } from "../entities/Event";
import { Diary } from "../entities/Diary";
import { Lesson } from "../entities/Lesson";
import { KinderWork } from "../entities/KinderWork";
import { Finance } from "../entities/Finance";
import { Stock } from "../entities/Stock";
import { Asset } from "../entities/Asset";
import { TeacherAttendance } from "../entities/TeacherAttendance";
import { TeacherSalary } from "../entities/TeacherSalary";
import { TimeTable } from "../entities/TimeTable";
import { Message } from "../entities/Message";
import { GuardianLink } from "../entities/GuardianLink";
import { Student } from "../entities/Student";
import { Teacher } from "../entities/Teacher";

import * as pg from "@neondatabase/serverless";
dotenv.config();

try {
  const ws = require("ws");
  if (ws && (pg as any).neonConfig) {
      (pg as any).neonConfig.webSocketConstructor = ws;
  }
} catch (e) {}

export const AppDataSource = new DataSource({
  type: "postgres",
  driver: pg,
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || "neondb",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  synchronize: true,
  logging: true,
  entities: [
    User, Notification, AppSession, ClassRoom, Event, Diary, Lesson, KinderWork, Finance, Stock, Asset, TeacherAttendance, TeacherSalary, TimeTable, Message, GuardianLink, Student, Teacher
  ],
  migrations: [],
  subscribers: [],
});