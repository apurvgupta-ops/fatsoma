import type { Request, Response } from "express";
import * as userService from "../services/user.service";
import { paramId } from "../utils/paramId";
import { sendSuccess, sendMessage } from "../utils/response";

export async function list(_req: Request, res: Response) {
  const users = await userService.listUsers();
  sendSuccess(res, users, "Users retrieved");
}

export async function create(req: Request, res: Response) {
  const { name, email, password, role } = req.body;
  const user = await userService.createUser(name, email, password, role);
  sendSuccess(res, user, "User created successfully", 201);
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
