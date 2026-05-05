import type { Request, Response } from "express";
import * as userService from "../services/user.service";
import { paramId } from "../utils/paramId";
import { sendSuccess, sendMessage } from "../utils/response";

export async function list(_req: Request, res: Response) {
  const roleQuery = _req.query.role;
  const role =
    typeof roleQuery === "string"
      ? (roleQuery as "admin" | "staff" | "organizer" | "user")
      : undefined;
  const users = await userService.listUsers(role);
  sendSuccess(res, users, "Users retrieved");
}

export async function create(req: Request, res: Response) {
  const { name, email, password, role } = req.body;
  const user = await userService.createUser(name, email, password, role);
  sendSuccess(res, user, "User created successfully", 201);
}

export async function listStaff(req: Request, res: Response) {
  const role = req.user!.role as "admin" | "organizer";
  const staff = await userService.listStaff(req.user!.userId, role);
  sendSuccess(res, staff, "Staff retrieved");
}

export async function createStaff(req: Request, res: Response) {
  const { name, email, password, staffEventId, staffGateName } = req.body;
  const user = await userService.createStaffUser(
    name,
    email,
    password,
    staffEventId,
    staffGateName,
    req.user!.role as "admin" | "organizer",
    req.user!.userId,
  );
  sendSuccess(res, user, "Staff created successfully", 201);
}

export async function updateStaffStatus(req: Request, res: Response) {
  const id = paramId(req.params);
  const message = await userService.updateStaffStatus(
    id,
    req.body.isActive,
    req.user!.userId,
    req.user!.role as "admin" | "organizer",
  );
  sendMessage(res, message);
}

export async function removeStaff(req: Request, res: Response) {
  const id = paramId(req.params);
  await userService.deleteStaffUser(
    id,
    req.user!.userId,
    req.user!.role as "admin" | "organizer",
  );
  sendMessage(res, "Staff member deleted");
}

export async function updateStatus(req: Request, res: Response) {
  const id = paramId(req.params);
  const message = await userService.updateUserStatus(id, req.body.isActive);
  sendMessage(res, message);
}

export async function updateRole(req: Request, res: Response) {
  const id = paramId(req.params);
  const message = await userService.updateUserRole(id, req.body.role);
  sendMessage(res, message);
}

export async function remove(req: Request, res: Response) {
  const id = paramId(req.params);
  await userService.deleteUser(id, req.user!.userId);
  sendMessage(res, "User deleted");
}
