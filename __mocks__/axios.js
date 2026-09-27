const axios = jest.genMockFromModule('axios');
axios.interceptors = {
  request: { use: jest.fn() },
  response: { use: jest.fn() },
};
axios.create = jest.fn(() => axios);
module.exports = axios;
