import { mount } from '@vue/test-utils'

test('Vue 컴포넌트를 DOM에 렌더링한다', () => {
  const wrapper = mount({ template: '<button>질문하기</button>' })
  expect(wrapper.get('button').text()).toBe('질문하기')
  wrapper.unmount()
})
