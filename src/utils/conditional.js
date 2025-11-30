export function evaluateCondition(condition, answersSoFar) {
  const { questionKey, operator, value } = condition;
  const left = answersSoFar[questionKey];

  if (operator === 'equals') return left == value;
  if (operator === 'notEquals') return left != value;
  if (operator === 'contains') {
    if (Array.isArray(left)) return left.includes(value);
    if (typeof left === 'string') return left.includes(value);
    return false;
  }
  return false;
}

export function shouldShowQuestion(rules, answersSoFar) {
  if (!rules || !rules.conditions || rules.conditions.length === 0) return true;
  const results = rules.conditions.map(c => {
    try { 
      return evaluateCondition(c, answersSoFar); 
    } catch (_) { 
      return false; 
    }
  });
  if (rules.logic === 'AND') return results.every(Boolean);
  return results.some(Boolean);
}
