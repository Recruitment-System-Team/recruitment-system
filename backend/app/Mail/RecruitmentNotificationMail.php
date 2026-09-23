<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RecruitmentNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $subjectLine,
        public string $heading,
        public string $messageText,
        public array $details = []
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subjectLine
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.recruitment-notification'
        );
    }

    public function attachments(): array
    {
        return [];
    }
}