import axios from 'axios';

describe('tRPC hello endpoint', () => {
  it('should return the input message', async () => {
    const res = await axios.get(`/hello?input=${encodeURIComponent(JSON.stringify({ name: 'World' }))}`);

    expect(res.status).toBe(200);
    expect(res.data.result.data).toEqual({ message: 'World'});
  });
});
