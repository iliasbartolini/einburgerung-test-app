import { getTopicForQuestion, findCorrectOption } from '../transform-questions';

describe('getTopicForQuestion', () => {
  it('returns politik for questions 1-100', () => {
    expect(getTopicForQuestion(1)).toBe('politik');
    expect(getTopicForQuestion(50)).toBe('politik');
    expect(getTopicForQuestion(100)).toBe('politik');
  });

  it('returns geschichte for questions 101-200', () => {
    expect(getTopicForQuestion(101)).toBe('geschichte');
    expect(getTopicForQuestion(150)).toBe('geschichte');
    expect(getTopicForQuestion(200)).toBe('geschichte');
  });

  it('returns gesellschaft for questions 201-300', () => {
    expect(getTopicForQuestion(201)).toBe('gesellschaft');
    expect(getTopicForQuestion(250)).toBe('gesellschaft');
    expect(getTopicForQuestion(300)).toBe('gesellschaft');
  });

  it('returns bundesland for questions 301-460', () => {
    expect(getTopicForQuestion(301)).toBe('bundesland');
    expect(getTopicForQuestion(400)).toBe('bundesland');
    expect(getTopicForQuestion(460)).toBe('bundesland');
  });
});

describe('findCorrectOption', () => {
  const options = ['Berlin', 'München', 'Hamburg', 'Köln'];

  it('returns the correct letter for each position', () => {
    expect(findCorrectOption(options, 'Berlin')).toBe('a');
    expect(findCorrectOption(options, 'München')).toBe('b');
    expect(findCorrectOption(options, 'Hamburg')).toBe('c');
    expect(findCorrectOption(options, 'Köln')).toBe('d');
  });

  it('throws when answer is not in options', () => {
    expect(() => findCorrectOption(options, 'Stuttgart')).toThrow(
      'Answer "Stuttgart" not found in options'
    );
  });
});
