import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { AiService, ChatMessage } from '../../core/ai.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'self-chat-widget',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './chat-widget.html',
  styleUrl: './chat-widget.css'
})
export class ChatWidgetComponent {
  isOpen = false;
  isLoading = false;
  ollamaAvailable = false;
  draft = '';
  messages: ChatMessage[] = [
    {
      role: 'assistant',
      text: 'Merhaba! Fatura, kullanım ve paket konularında yardımcı olabilirim. Sorunuzu yazın veya alttaki önerilerden birini seçin.'
    }
  ];

  readonly quickPrompts = [
    'Bu ay faturam neden yüksek geldi?',
    'Bugünkü internet, dakika ve SMS kullanımım nedir?',
    'Kalan internet kotam ne kadar?',
    'Bana uygun paket öner'
  ];

  constructor(
    private aiService: AiService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  get assistantSubtitle(): string {
    return this.ollamaAvailable
      ? 'Ollama AI · Canlı fatura & kullanım'
      : 'Canlı fatura & kullanım verisi';
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.refreshHealth();
    }
  }

  private refreshHealth(): void {
    this.aiService.getHealth().subscribe({
      next: (health) => {
        this.ollamaAvailable = !!health.ollamaAvailable;
        this.cdr.detectChanges();
      },
      error: () => {
        this.ollamaAvailable = false;
        this.cdr.detectChanges();
      }
    });
  }

  usePrompt(prompt: string): void {
    this.draft = prompt;
    this.send();
  }

  send(): void {
    const text = this.draft.trim();
    if (!text || this.isLoading) {
      return;
    }

    this.messages.push({ role: 'user', text });
    this.draft = '';
    this.cdr.detectChanges();

    if (!this.authService.isLoggedIn() || !this.authService.getCustomerId()) {
      this.messages.push({
        role: 'assistant',
        text: 'Fatura ve kullanım bilgilerinize erişebilmem için önce giriş yapmalısınız.'
      });
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    const history = this.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-7, -1)
      .map((m) => ({ role: m.role, content: m.text }));

    this.aiService.sendChat(text, history).subscribe({
      next: (response: { reply: string; aiPowered: boolean }) => {
        this.isLoading = false;
        this.ollamaAvailable = response.aiPowered || this.ollamaAvailable;
        this.messages.push({
          role: 'assistant',
          text: response.reply,
          aiPowered: response.aiPowered
        });
        this.cdr.detectChanges();
      },
      error: (err: { error?: { message?: string } }) => {
        this.isLoading = false;
        this.messages.push({
          role: 'assistant',
          text: err?.error?.message
            ?? 'Asistan şu an yanıt veremedi. ai-support-service (8088) çalışıyor mu kontrol edin.'
        });
        this.cdr.detectChanges();
      }
    });
  }
}
