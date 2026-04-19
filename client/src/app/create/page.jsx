"use client";

import { ethers } from "ethers";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { ClientButton, FormInput } from "@/components";
import { useEthersContext } from "@/contexts/EthersContext";

const CATEGORIES = [
  { label: "General",     value: "General"     },
  { label: "Tech",        value: "Tech"        },
  { label: "Health",      value: "Health"      },
  { label: "Education",   value: "Education"   },
  { label: "Environment", value: "Environment" },
  { label: "Community",   value: "Community"   },
];

const Create = () => {
  const router = useRouter();
  const { signer, contract, connectWallet } = useEthersContext();
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    title: "",
    category: "General",
    description: "",
    imageFile: null,
    target: "",
    deadline: "",
  });

  const handleFormInputChange = (field, event) => {
    if (field === "imageFile") {
      setFormValues({ ...formValues, [field]: event.target.files[0] });
    } else {
      setFormValues({ ...formValues, [field]: event.target.value });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (
      !formValues.title ||
      !formValues.description ||
      !formValues.imageFile ||
      !formValues.target ||
      !formValues.deadline
    )
      return toast.error("Please fill all the fields");

    if (!signer) return connectWallet();

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append("file", formValues.imageFile);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image upload failed");
      const imageUrl = data.imageUrl;

      const { title, description, category } = formValues;
      const target   = ethers.parseUnits(formValues.target, 18).toString();
      const deadline = Math.floor(new Date(formValues.deadline).getTime() / 1000);
      await contract.createCampaign(title, description, imageUrl, category, target, deadline, {
        gasLimit: 1000000,
      });
      toast.success("Campaign created successfully.");
      handleReset();
      setTimeout(() => router.push("/account"), 2000);
    } catch (error) {
      toast.error("Campaign couldn't be created.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormValues({
      title: "", category: "General", description: "",
      imageFile: null, target: "", deadline: "",
    });
  };

  const targetParsed = parseFloat(formValues.target) || 0;
  const gbpValue = (targetParsed * 2800).toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  });

  return (
    <main className="w-full min-h-[calc(100vh-96px)] flex items-center justify-center p-4">
      <div className="w-full max-w-[620px] glass rounded-2xl p-7 sm:p-10 shadow-glass-hover relative overflow-hidden">

        {/* Ambient blobs inside card */}
        <div className="absolute -top-28 -right-28 w-56 h-56 rounded-full bg-neon-violet/[0.09] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-28 -left-28 w-48 h-48 rounded-full bg-neon-emerald/[0.07] blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-violet mb-4 shadow-glow-violet">
            <span className="text-2xl">🚀</span>
          </div>
          <h1 className="text-3xl font-extrabold gradient-text mb-2">Create a Campaign</h1>
          <p className="text-text-muted text-sm">
            Launch your fundraising goal on the Ethereum blockchain.
          </p>
        </div>

        <form className="flex flex-col gap-5 relative z-10" onSubmit={handleSubmit}>
          <FormInput
            label="Campaign Title"
            placeholder="e.g., Build a community centre"
            type="text"
            value={formValues.title}
            onChange={(e) => handleFormInputChange("title", e)}
          />

          <FormInput
            label="Category"
            type="select"
            options={CATEGORIES}
            value={formValues.category}
            onChange={(e) => handleFormInputChange("category", e)}
          />

          <FormInput
            label="Story & Details"
            placeholder="Write why you need this funding…"
            type="textarea"
            value={formValues.description}
            onChange={(e) => handleFormInputChange("description", e)}
          />

          <div className="flex flex-col sm:flex-row gap-5">
            {/* Funding goal */}
            <div className="w-full relative">
              <FormInput
                label="Funding Goal (ETH)"
                placeholder="0.00"
                type="number"
                value={formValues.target}
                onChange={(e) => handleFormInputChange("target", e)}
              />
              {targetParsed > 0 && (
                <span className="absolute right-4 top-11 text-xs text-neon-emerald font-semibold pointer-events-none">
                  ≈ {gbpValue}
                </span>
              )}
            </div>

            <FormInput
              label="Deadline"
              placeholder="Pick a deadline…"
              type="date"
              value={formValues.deadline}
              onChange={(e) => handleFormInputChange("deadline", e)}
            />
          </div>

          <FormInput
            label="Cover Image"
            type="file"
            onChange={(e) => handleFormInputChange("imageFile", e)}
          />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-2 pt-6 border-t border-white/[0.07]">
            <ClientButton
              className="glass text-text-secondary hover:text-text-primary transition-all duration-200 py-3 px-6 rounded-xl font-semibold w-full sm:w-auto text-sm"
              onClick={handleReset}
              type="button"
            >
              Reset
            </ClientButton>
            <ClientButton
              loading={loading}
              className="btn-glass-primary py-3 px-8 rounded-xl w-full sm:w-auto text-sm"
              onClick={handleSubmit}
              type="submit"
            >
              Launch Campaign 🚀
            </ClientButton>
          </div>
        </form>
      </div>
    </main>
  );
};

export default Create;
