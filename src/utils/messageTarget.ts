let pendingMessageTarget: string | null = null;

export function setMessageTarget(userId: string) {
  pendingMessageTarget = userId;
}

export function consumeMessageTarget(): string | null {
  const target = pendingMessageTarget;
  pendingMessageTarget = null;
  return target;
}
