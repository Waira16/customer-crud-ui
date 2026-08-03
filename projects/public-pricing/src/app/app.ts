import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatWidgetComponent } from './components/chat-widget/chat-widget';

@Component({
  selector: 'pub-root',
  standalone: true,
  imports: [RouterOutlet, ChatWidgetComponent],
  template: `
    <router-outlet></router-outlet>
    <pub-chat-widget></pub-chat-widget>
  `
})
export class App {}
