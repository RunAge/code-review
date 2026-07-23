export interface CommentAuthor {
  login: string;
  type: string;
}

const BOT_LOGIN_PATTERNS = [/\[bot\]/i, /copilot/i, /codegen/i, /assistant/i];

export function detectCommentAuthorType(
  author: CommentAuthor
): "human" | "bot" {
  if (author.type.toLowerCase() === "bot") {
    return "bot";
  }

  const looksLikeBot = BOT_LOGIN_PATTERNS.some((pattern) =>
    pattern.test(author.login)
  );
  return looksLikeBot ? "bot" : "human";
}
