import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatWidgetComponent } from './components/chat-widget/chat-widget';

@Component({
  selector: 'self-root',
  standalone: true,
  imports: [RouterOutlet, ChatWidgetComponent],
  template: `
    <router-outlet></router-outlet>
    <self-chat-widget></self-chat-widget>
  `
})
export class App {}
