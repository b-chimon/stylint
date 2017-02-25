'use strict';

const stylint = require('../../index');

const app = stylint().create();

// turn on strict mode from this point and turn off unnecessary logging
app.state.strictMode = true;
app.state.quiet = true;
app.state.watching = true;

const startsWithComment = app.startsWithComment.bind(app);

describe('starts with comment', () => {
  beforeEach(() => {
    app.state.severity = 'warning';
  });

  afterEach(() => {
    app.cache.messages = [];
  });

  it('false if // not first char on line', () => {
    expect(startsWithComment('margin 0 auto //test')).toEqual(false);
  });

  it('true if // is the first character on the line', () => {
    expect(startsWithComment('//test')).toBeDefined();
    expect(startsWithComment(' // test')).toBeDefined();
  });
});
