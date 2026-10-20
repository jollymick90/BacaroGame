import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_QUESTIONS, validateQuestionConfig } from './questions.ts';

function config() {
  return { questions: [{ id: 'test-question', prompt: 'Quale valore indica vero?', answers: ['true', 'false', 'null'], correctIndex: 0, explanation: 'true indica vero.' }] };
}

test('default bank supplies twenty valid questions and validation returns an independent normalized copy', () => {
  const defaults = validateQuestionConfig({ questions: DEFAULT_QUESTIONS });
  assert.equal(defaults.questions.length, 20);
  assert.equal(new Set(defaults.questions.map(question => question.id)).size, 20);
  const input = config();
  input.questions[0].prompt = '  Quale valore indica vero?  ';
  const parsed = validateQuestionConfig(input);
  assert.equal(parsed.questions[0].prompt, 'Quale valore indica vero?');
  parsed.questions[0].answers[0] = 'changed';
  assert.equal(input.questions[0].answers[0], 'true');
});

test('rejects missing, empty and oversized banks and duplicate or unsafe IDs', () => {
  for (const input of [null, [], {}, { questions: [] }, { questions: Array.from({ length: 101 }, (_, index) => ({ ...config().questions[0], id: `q-${index}` })) }]) {
    assert.throws(() => validateQuestionConfig(input));
  }
  assert.throws(() => validateQuestionConfig({ questions: [config().questions[0], config().questions[0]] }), /identificativ/i);
  for (const id of ['', '../document', 'a'.repeat(81)]) {
    const input = config();
    input.questions[0].id = id;
    assert.throws(() => validateQuestionConfig(input), /identificativ/i);
  }
});

test('rejects ambiguous options, invalid correct answers and missing or excessive text', () => {
  for (const answers of [['true', 'false'], ['true', 'false', 'null', '0'], ['true', ' TRUE ', 'false'], ['true', '', 'false']]) {
    const input = config();
    input.questions[0].answers = answers;
    assert.throws(() => validateQuestionConfig(input), /rispost/i);
  }
  for (const correctIndex of [-1, 3, 1.5, NaN]) {
    const input = config();
    input.questions[0].correctIndex = correctIndex;
    assert.throws(() => validateQuestionConfig(input), /corrett/i);
  }
  for (const [field, value] of [['prompt', ' '], ['prompt', 'a'.repeat(301)], ['explanation', ''], ['explanation', 'a'.repeat(301)]] as const) {
    const input = config();
    input.questions[0][field] = value;
    assert.throws(() => validateQuestionConfig(input));
  }
  const longAnswer = config();
  longAnswer.questions[0].answers[0] = 'a'.repeat(121);
  assert.throws(() => validateQuestionConfig(longAnswer), /rispost/i);
});

test('accepts the bank boundaries and every answer position', () => {
  for (const correctIndex of [0, 1, 2]) {
    const input = config();
    input.questions[0].correctIndex = correctIndex;
    assert.equal(validateQuestionConfig(input).questions[0].correctIndex, correctIndex);
  }
  const questions = Array.from({ length: 100 }, (_, index) => ({ ...config().questions[0], id: `q-${index}` }));
  assert.equal(validateQuestionConfig({ questions }).questions.length, 100);
});
