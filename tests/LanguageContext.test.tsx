import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Test component to expose context values
const TestConsumer: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div>
      <span data-testid="language">{language}</span>
      <span data-testid="title">{t.appTitle}</span>
      <span data-testid="setup">{t.setupTitle}</span>
      <button onClick={() => setLanguage('en')} data-testid="switch-en">EN</button>
      <button onClick={() => setLanguage('pt')} data-testid="switch-pt">PT</button>
    </div>
  );
};

describe('LanguageContext', () => {
  it('defaults to Portuguese', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );
    expect(screen.getByTestId('language').textContent).toBe('pt');
    expect(screen.getByTestId('setup').textContent).toBe('Squad Daily');
  });

  it('can switch to English', async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );
    
    await user.click(screen.getByTestId('switch-en'));
    expect(screen.getByTestId('language').textContent).toBe('en');
    expect(screen.getByTestId('setup').textContent).toBe('Daily Squad');
  });

  it('can switch back to Portuguese', async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );
    
    await user.click(screen.getByTestId('switch-en'));
    await user.click(screen.getByTestId('switch-pt'));
    expect(screen.getByTestId('language').textContent).toBe('pt');
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useLanguage must be used within a LanguageProvider');
    spy.mockRestore();
  });

  it('provides appTitle in both languages', async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );
    
    expect(screen.getByTestId('title').textContent).toBe('DailyBet');
    await user.click(screen.getByTestId('switch-en'));
    expect(screen.getByTestId('title').textContent).toBe('DailyBet');
  });
});
