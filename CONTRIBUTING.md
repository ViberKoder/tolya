# Contributing to Jetton Minter 2.0

Thank you for your interest in contributing to Jetton Minter 2.0! We welcome contributions from the community.

## 🤝 How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Your environment (OS, browser, wallet, etc.)

### Suggesting Features

We're always looking for ways to improve! When suggesting a feature:

- Explain the problem it solves
- Describe your proposed solution
- Share examples or mockups if possible

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/jetton-minter-2.0.git
   ```

2. **Create a branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments where necessary
   - Test your changes

4. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Provide clear description of changes
   - Reference any related issues
   - Add screenshots/demos if relevant

## 📝 Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow existing naming conventions
- Keep components small and focused
- Write self-documenting code

### Testing

Before submitting:

- Test on both testnet and mainnet
- Check responsive design on mobile
- Test with different wallets
- Verify gas costs are reasonable

### Smart Contracts

When modifying contracts:

- Follow FunC best practices
- Test thoroughly on testnet
- Document all functions
- Consider gas optimization
- Maintain Jetton 2.0 compatibility

### Commit Messages

Use clear, descriptive commit messages:

- ✨ `feat: add new feature`
- 🐛 `fix: resolve bug`
- 📝 `docs: update documentation`
- 💄 `style: improve UI`
- ♻️ `refactor: restructure code`
- ⚡ `perf: improve performance`
- 🔧 `chore: update config`

## 🏗 Project Structure

```
src/
├── app/           # Next.js pages
├── components/    # React components
├── hooks/        # Custom hooks
├── lib/          # Utilities
└── types/        # TypeScript types

contracts/
├── jetton-minter-v2.fc
├── jetton-wallet-v2.fc
└── imports/
```

## 🧪 Testing Your Changes

### Frontend Testing

```bash
npm run dev
# Test in browser at http://localhost:3000
```

### Contract Testing

```bash
./scripts/compile.sh
# Verify compilation succeeds
```

## 📋 Checklist

Before submitting a PR:

- [ ] Code follows project style
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Tested on testnet
- [ ] No console errors
- [ ] Responsive design works
- [ ] Gas costs are reasonable

## 🆘 Need Help?

- Check existing issues and PRs
- Read the documentation
- Ask in TON Dev Telegram
- Open a discussion on GitHub

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Every contribution helps make Jetton Minter 2.0 better for everyone in the TON ecosystem!
