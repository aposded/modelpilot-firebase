import axios from 'axios';
import { expect } from 'chai';

describe('process-prompt', () => {
  it('should respond with the configured greeting', async () => {
    const httpFunctionUri =
      'http://localhost:5001/demo-test/us-central1/ext-greet-the-world-processPrompt/';
    const res = await axios.get(httpFunctionUri);

    console.log(res.data);

    expect(res.data).to.not.be.empty;
  }).timeout(10000);
});
