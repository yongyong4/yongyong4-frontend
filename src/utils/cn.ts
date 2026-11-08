// 조건부 className 합치기. false·undefined는 빠짐
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
