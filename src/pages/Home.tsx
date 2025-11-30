import React from "react";
import { Layout, Text } from "@stellar/design-system";
// Yeni bileşeni import edin
import { Ch3sSaleComponent } from "../components/Ch3sSale";

const Home: React.FC = () => (
  <Layout.Content>
    <Layout.Inset>
      <Text as="h1" size="xl">
        Token Satış Platformu
      </Text>

      {/* ... Diğer metinler ... */}

      <Text as="h2" size="lg" addlClassName="mt-8">
        &lt;CH3SSale /&gt;
      </Text>

      {/* Bileşeni buraya ekleyin */}
      <div style={{ marginTop: "20px", marginBottom: "40px" }}>
        <Ch3sSaleComponent />
      </div>

      <hr />

      {/* ... Kalan kodlar ... */}
    </Layout.Inset>
  </Layout.Content>
);

export default Home;
