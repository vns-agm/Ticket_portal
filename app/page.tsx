import Header from './components/Header';
import Footer from './components/Footer';
import Content from './components/Content';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Content />
      <Footer />
    </div>
  );
}
