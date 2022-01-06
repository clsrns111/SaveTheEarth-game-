import { $ } from "../util";

export function Modal(type: string): void {
  console.log("hi");
  open(type);
}

function open(type: string) {
  $("body")!.innerHTML = `  
          <div class="modal">
          <form>
          <input id="${type}Name" type="text">
          <input id="${type}Url" type="text">
          </form>
          </div>
            `;
}
