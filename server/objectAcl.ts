import { S3ObjectReference } from "./objectStorage";

const ACL_POLICY_METADATA_KEY = "custom:aclPolicy";

// The type of the access group.
export enum ObjectAccessGroupType {
  SUBSCRIBER = "subscriber", // Users who are subscribers of a content creator
  USER_LIST = "user_list",   // Users from a specific list
}

// The logic user group that can access the object.
export interface ObjectAccessGroup {
  type: ObjectAccessGroupType;
  id: string; // Creator ID for subscribers, list ID for user lists
}

export enum ObjectPermission {
  READ = "read",
  WRITE = "write",
}

export interface ObjectAclRule {
  group: ObjectAccessGroup;
  permission: ObjectPermission;
}

// The ACL policy of the object.
export interface ObjectAclPolicy {
  owner: string;
  visibility: "public" | "private";
  aclRules?: Array<ObjectAclRule>;
}

// Check if the requested permission is allowed based on the granted permission.
function isPermissionAllowed(
  requested: ObjectPermission,
  granted: ObjectPermission,
): boolean {
  // Users granted with read or write permissions can read the object.
  if (requested === ObjectPermission.READ) {
    return [ObjectPermission.READ, ObjectPermission.WRITE].includes(granted);
  }

  // Only users granted with write permissions can write the object.
  return granted === ObjectPermission.WRITE;
}

// Base class for access groups
abstract class BaseObjectAccessGroup implements ObjectAccessGroup {
  constructor(
    public readonly type: ObjectAccessGroupType,
    public readonly id: string,
  ) {}

  // Check if the user is a member of the group.
  public abstract hasMember(userId: string): Promise<boolean>;
}

// Subscriber access group for content creators
class SubscriberAccessGroup extends BaseObjectAccessGroup {
  constructor(creatorId: string) {
    super(ObjectAccessGroupType.SUBSCRIBER, creatorId);
  }

  async hasMember(userId: string): Promise<boolean> {
    // TODO: Implement subscription check against database
    // Check if userId has an active subscription to creator (this.id)
    // For now, return false - this will be implemented when we add subscription endpoints
    return false;
  }
}

// User list access group
class UserListAccessGroup extends BaseObjectAccessGroup {
  constructor(listId: string) {
    super(ObjectAccessGroupType.USER_LIST, listId);
  }

  async hasMember(userId: string): Promise<boolean> {
    // TODO: Implement user list membership check
    // For now, return false
    return false;
  }
}

function createObjectAccessGroup(
  group: ObjectAccessGroup,
): BaseObjectAccessGroup {
  switch (group.type) {
    case ObjectAccessGroupType.SUBSCRIBER:
      return new SubscriberAccessGroup(group.id);
    case ObjectAccessGroupType.USER_LIST:
      return new UserListAccessGroup(group.id);
    default:
      throw new Error(`Unknown access group type: ${group.type}`);
  }
}

// Sets the ACL policy to the object metadata.
// Note: R2 doesn't support custom metadata like GCS, so ACL policies are simplified
// In a full implementation, you would store ACL policies in a database table
export async function setObjectAclPolicy(
  objectRef: S3ObjectReference,
  aclPolicy: ObjectAclPolicy,
): Promise<void> {
  // R2 simplified implementation: ACL policies would be stored in database
  // For now, this is a no-op to maintain API compatibility
  console.log(`[ACL] Setting ACL policy for ${objectRef.bucket}/${objectRef.key}:`, aclPolicy.visibility);
}

// Gets the ACL policy from the object metadata.
// Note: R2 doesn't support custom metadata like GCS, so this returns a default policy
export async function getObjectAclPolicy(
  objectRef: S3ObjectReference,
): Promise<ObjectAclPolicy | null> {
  // R2 simplified implementation: Return a default public policy
  // In a full implementation, you would fetch from a database table
  return {
    owner: "system",
    visibility: "public",
    aclRules: [],
  };
}

// Checks if the user can access the object.
export async function canAccessObject({
  userId,
  objectFile,
  requestedPermission,
}: {
  userId?: string;
  objectFile: S3ObjectReference;
  requestedPermission: ObjectPermission;
}): Promise<boolean> {
  // R2 simplified implementation: All objects are accessible
  // In a full implementation, you would check ACL policies from database
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    return false;
  }

  // Public objects are always accessible for read.
  if (
    aclPolicy.visibility === "public" &&
    requestedPermission === ObjectPermission.READ
  ) {
    return true;
  }

  // Access control requires the user id.
  if (!userId) {
    return false;
  }

  // The owner of the object can always access it.
  if (aclPolicy.owner === userId) {
    return true;
  }

  // Go through the ACL rules to check if the user has the required permission.
  for (const rule of aclPolicy.aclRules || []) {
    const accessGroup = createObjectAccessGroup(rule.group);
    if (
      (await accessGroup.hasMember(userId)) &&
      isPermissionAllowed(requestedPermission, rule.permission)
    ) {
      return true;
    }
  }

  return false;
}