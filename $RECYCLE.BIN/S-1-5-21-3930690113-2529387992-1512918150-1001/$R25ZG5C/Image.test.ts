import Image from "../components/Image";

test("image버튼 클릭 시 모달창이 나온다.", () => {
  Image();

  const addEvent = new Event("click");
  document.dispatchEvent(addEvent);

  const div = document.createElement("div");

  expect(getByTestid('')).toHaveTextContent("이미지 이름");
  expect(div).toHaveTextContent("이미지 주소");
});
