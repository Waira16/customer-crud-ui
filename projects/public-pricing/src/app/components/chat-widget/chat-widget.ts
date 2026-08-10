import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { AiService } from '../../core/ai.service';

interface PubChatMessage {
  role: 'user' | 'assistant';
  text: string;
  aiPowered?: boolean;
}

@Component({
  selector: 'pub-chat-widget',
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
  messages: PubChatMessage[] = [
    {
      role: 'assistant',
      text: 'Merhaba! İnternet ve dakika ihtiyacınıza göre tarife önerebilirim.'
    }
  ];

  readonly quickPrompts = [
    { label: '5 GB · 100 dk', dataGb: 5, minutes: 100 },
    { label: '20 GB · 500 dk', dataGb: 20, minutes: 500 },
    { label: 'Sınırsız paket', dataGb: 50, minutes: 2000 }
  ];

  constructor(
    private aiService: AiService,
    private cdr: ChangeDetectorRef
  ) {}

  get assistantSubtitle(): string {
    return this.ollamaAvailable
      ? 'Tarife önerisi'
      : 'Tarife öneri asistanı';
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

  usePrompt(prompt: { label: string; dataGb: number; minutes: number }): void {
    this.askRecommendation(prompt.label, prompt.dataGb, prompt.minutes);
  }

  send(): void {
    const text = this.draft.trim();
    if (!text || this.isLoading) {
      return;
    }
    this.askRecommendation(text, 10, 300);
  }

  private askRecommendation(text: string, dataGb: number, minutes: number): void {
    this.messages.push({ role: 'user', text });
    this.draft = '';
    this.isLoading = true;
    this.cdr.detectChanges();

    this.aiService.recommendPackage({ dataGb, minutes }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.ollamaAvailable = response.aiPowered || this.ollamaAvailable;
        let reply = response.recommendation;
        if (response.tariffName) {
          reply += `\n\nÖnerilen tarife: ${response.tariffName}`;
        }
        if (response.estimatedMonthlyTotal != null) {
          reply += `\nTahmini aylık: ${response.estimatedMonthlyTotal.toFixed(2)} TL`;
        }
        this.messages.push({
          role: 'assistant',
          text: reply,
          aiPowered: response.aiPowered
        });
        this.cdr.detectChanges();
      },
      error: (err: { error?: { message?: string } }) => {
        this.isLoading = false;
        this.messages.push({
          role: 'assistant',
          text: err?.error?.message
            ?? 'AI öneri servisi yanıt vermedi. ai-support-service (8088) çalışıyor mu kontrol edin.'
        });
        this.cdr.detectChanges();
      }
    });
  }
}
